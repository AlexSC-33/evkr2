<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #0a0a0f;
  color: #ffffff;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #0a0a0f;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #00ffff, #ff00ff);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #00ffff, #ffff00);
}

/* CSS Variables for neon colors */
:root {
  --neon-cyan: #00ffff;
  --neon-magenta: #ff00ff;
  --neon-yellow: #ffff00;
  --neon-green: #00ff88;
  --neon-purple: #9d00ff;
  --neon-red: #ff0055;
  --bg-dark: #0a0a0f;
  --bg-card: #0f0f1a;
  --bg-card-hover: #1a1a2e;
  --text-primary: #ffffff;
  --text-secondary: #8b8b9f;
  --border-color: #1e1e3f;
}

/* Selection */
::selection {
  background: rgba(0, 255, 255, 0.3);
  color: #ffffff;
}

::-moz-selection {
  background: rgba(0, 255, 255, 0.3);
  color: #ffffff;
}
</style>
