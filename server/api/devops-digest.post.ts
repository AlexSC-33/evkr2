export default defineEventHandler(async (event) => {
  // RSS Feed sources for DevOps content
  const rssSources = [
    { name: 'AWS Blog', url: 'https://aws.amazon.com/blogs/aws/feed/', category: 'Cloud' },
    { name: 'Azure Updates', url: 'https://azure.microsoft.com/en-us/blog/feed/', category: 'Cloud' },
    { name: 'Google Cloud Blog', url: 'https://cloudblog.withgoogle.com/rss/', category: 'Cloud' },
    { name: 'HashiCorp Blog', url: 'https://www.hashicorp.com/blog/feed.xml', category: 'Infrastructure' },
    { name: 'Kubernetes Blog', url: 'https://kubernetes.io/feed.xml', category: 'Containers' },
    { name: 'Docker Blog', url: 'https://www.docker.com/blog/feed/', category: 'Containers' },
    { name: 'CNCF Blog', url: 'https://www.cncf.io/feed/', category: 'Containers' },
    { name: 'DevOps.com', url: 'https://devops.com/feed/', category: 'General' },
    { name: 'The New Stack', url: 'https://thenewstack.io/feed/', category: 'General' }
  ]

  try {
    console.log('📡 Starting DevOps digest generation...')
    
    // Step 1: Fetch RSS feeds directly
    console.log('Fetching from', rssSources.length, 'RSS sources...')
    const feedPromises = rssSources.map(async (source) => {
      try {
        console.log(`Fetching ${source.name}...`)
        
        // Fetch RSS feed directly
        const response = await $fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
          },
          timeout: 15000,
          parseResponse: txt => txt // Get raw text instead of parsed response
        })
        
        // Parse XML (simple regex-based parsing for RSS/Atom feeds)
        const items = parseRSSFeed(response as string, source.name)
        
        if (items && items.length > 0) {
          console.log(`✅ ${source.name}: ${items.length} items`)
          return {
            source: source.name,
            category: source.category,
            items: items.slice(0, 10) // Limit to 10 items per source
          }
        }
        
        // Debug: Log why no items were found
        const xmlPreview = typeof response === 'string' ? response.substring(0, 200) : String(response).substring(0, 200)
        console.warn(`⚠️ ${source.name}: No items parsed. XML preview:`, xmlPreview)
        return null
      } catch (err: any) {
        console.warn(`❌ Failed to fetch ${source.name}:`, err?.message, err?.statusCode || '')
        return null
      }
    })

    const feedResults = await Promise.all(feedPromises)
    const validFeeds = feedResults.filter(f => f !== null)
    
    console.log('✅ Successfully fetched', validFeeds.length, 'feeds')

    // Collect all articles
    const allArticles: any[] = []
    validFeeds.forEach(feed => {
      if (feed && feed.items) {
        allArticles.push(...feed.items.map((item: any) => ({
          ...item,
          category: feed.category
        })))
      }
    })

    console.log('📚 Total articles collected:', allArticles.length)

    // Step 2: Filter and summarize with AI (Hugging Face - Free, no API key needed!)

    // Prepare content for AI analysis
    const articlesText = allArticles.slice(0, 50).map((article, index) => 
      `[${index + 1}] ${article.title}\nCategory: ${article.category}\nSource: ${article.source}\nDescription: ${article.description}\nURL: ${article.url}\n`
    ).join('\n')

    const prompt = `You are a DevOps expert analyst. Analyze these recent DevOps articles and create a curated digest.

ARTICLES:
${articlesText}

Please analyze and respond with a JSON object in this EXACT format:
{
  "summary": "A 2-3 sentence executive summary of the most important trends",
  "categories": [
    {
      "name": "Cloud",
      "items": [
        {
          "title": "Article title",
          "description": "Why this matters (1-2 sentences)",
          "source": "Source name",
          "date": "ISO date",
          "url": "article url"
        }
      ]
    }
  ],
  "takeaways": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ]
}

FILTERING RULES:
- Only include truly significant updates (new products, major versions, important announcements)
- Skip minor bug fixes, marketing fluff, and generic tutorials
- Focus on: AWS, Azure, GCP, Kubernetes, Terraform, Ansible, Docker, CI/CD tools, OpenShift, security tools
- Limit to 3-5 items per category
- Categories: Cloud, Infrastructure, Containers, CI/CD, Security, Monitoring
- Provide 3-5 key takeaways

Return ONLY valid JSON, no markdown formatting.`

    console.log('📊 Generating categorized digest...')
    
    // Use basic categorization
    const categories = groupByCategory(allArticles)
    
    // Analyze articles to generate intelligent summary
    const summary = generateIntelligentSummary(allArticles, categories)
    
    return {
      digest: {
        summary: summary,
        categories: categories
      }
    }

  } catch (error: any) {
    console.error('❌ Error generating digest:', error)
    return {
      error: true,
      message: error?.message || 'Failed to generate digest'
    }
  }
})

// Helper function to parse RSS/Atom feeds
function parseRSSFeed(xmlString: any, sourceName: string): any[] {
  const items: any[] = []
  
  try {
    // Convert to string if needed
    if (typeof xmlString !== 'string') {
      xmlString = String(xmlString)
    }
    
    // Check if it's Atom or RSS format
    const isAtom = xmlString.includes('<feed') || xmlString.includes('xmlns="http://www.w3.org/2005/Atom"')
    
    if (isAtom) {
      // Parse Atom feed
      const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g
      let match
      
      while ((match = entryRegex.exec(xmlString)) !== null) {
        const entry = match[1]
        
        const title = extractTag(entry, 'title')
        const link = extractAtomLink(entry)
        const summary = extractTag(entry, 'summary') || extractTag(entry, 'content')
        const published = extractTag(entry, 'published') || extractTag(entry, 'updated')
        
        if (title) {
          items.push({
            title: cleanText(title),
            description: cleanText(summary).substring(0, 300),
            url: link,
            date: published || new Date().toISOString(),
            source: sourceName
          })
        }
      }
    } else {
      // Parse RSS feed
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g
      let match
      
      while ((match = itemRegex.exec(xmlString)) !== null) {
        const item = match[1]
        
        const title = extractTag(item, 'title')
        const link = extractTag(item, 'link')
        const description = extractTag(item, 'description') || extractTag(item, 'content:encoded')
        const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date')
        
        if (title) {
          items.push({
            title: cleanText(title),
            description: cleanText(description).substring(0, 300),
            url: link,
            date: pubDate || new Date().toISOString(),
            source: sourceName
          })
        }
      }
    }
  } catch (err) {
    console.error(`Error parsing feed from ${sourceName}:`, err)
  }
  
  return items
}

// Helper to extract tag content
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : ''
}

// Helper to extract Atom link
function extractAtomLink(entry: string): string {
  const linkRegex = /<link[^>]*href=["']([^"']+)["']/i
  const match = entry.match(linkRegex)
  return match ? match[1] : ''
}

// Helper to clean HTML and entities
function cleanText(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // Remove CDATA
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> with space
    .replace(/<\/?(p|div|span|b|strong|i|em|u|a)[^>]*>/gi, ' ') // Remove common tags
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)) // Decode numeric entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s([.,;:!?])/g, '$1') // Fix spacing before punctuation
    .trim()
}

// Generate intelligent summary by analyzing article content
function generateIntelligentSummary(articles: any[], categories: any[]): string {
  const totalArticles = articles.length
  const categoryCount = categories.length
  
  // Count articles per source
  const sourceCount: Record<string, number> = {}
  articles.forEach(article => {
    sourceCount[article.source] = (sourceCount[article.source] || 0) + 1
  })
  
  // Find trending topics by analyzing titles
  const keywords: Record<string, number> = {}
  const importantKeywords = ['kubernetes', 'docker', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'security', 'ai', 'ml', 'cloud', 'devops', 'cicd', 'monitoring', 'observability', 'serverless', 'containers', 'microservices', 'api', 'automation']
  
  articles.forEach(article => {
    const text = (article.title + ' ' + article.description).toLowerCase()
    importantKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords[keyword] = (keywords[keyword] || 0) + 1
      }
    })
  })
  
  // Get top 3 trending topics
  const trendingTopics = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
  
  // Build intelligent summary
  let summary = `Weekly DevOps digest analyzing ${totalArticles} articles from ${Object.keys(sourceCount).length} sources across ${categoryCount} key areas. `
  
  if (trendingTopics.length > 0) {
    summary += `This week's trending topics include ${trendingTopics.join(', ')}, `
  }
  
  // Add category-specific insights
  const categoryInsights: string[] = []
  categories.forEach(cat => {
    if (cat.items.length >= 5) {
      categoryInsights.push(`${cat.items.length} ${cat.name.toLowerCase()} updates`)
    }
  })
  
  if (categoryInsights.length > 0) {
    summary += `with significant coverage in ${categoryInsights.join(', ')}. `
  }
  
  summary += 'Scroll through each category to explore the latest developments in the DevOps ecosystem.'
  
  return summary
}

// Helper function to group articles by category
function groupByCategory(articles: any[]) {
  const categoryMap: Record<string, any[]> = {}
  
  articles.forEach(article => {
    const category = article.category || 'General'
    if (!categoryMap[category]) {
      categoryMap[category] = []
    }
    categoryMap[category].push({
      title: article.title,
      description: article.description,
      source: article.source,
      date: article.date,
      url: article.url
    })
  })

  return Object.keys(categoryMap).map(categoryName => ({
    name: categoryName,
    items: categoryMap[categoryName].slice(0, 8) // Limit to 8 per category for better coverage
  }))
}
