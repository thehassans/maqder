const fs = require('fs');

let landing = fs.readFileSync('landing_original.jsx', 'utf8');

const returnIndex = landing.indexOf('return (');
const heroEndIndex = landing.indexOf('{/* Stats Section */}');

let topPart = landing.slice(0, returnIndex);
let bottomPart = landing.slice(heroEndIndex);

// Add our imports at the top
topPart = topPart.replace('import { Link } from \'react-router-dom\'', 'import { Link } from \'react-router-dom\'\nimport { Header } from \'../components/ui/header-3\'\nimport { HeroSection } from \'../components/ui/hero-3\'');

// Replace the return block up to the Stats section
const newReturn = `return (
    <div className={\`flex w-full flex-col min-h-screen bg-white \${isArabic ? 'rtl' : 'ltr'}\`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Header isArabic={isArabic} setIsArabic={setIsArabic} />
      <main className="grow">
        <HeroSection isArabic={isArabic} />
      </main>
      `;

fs.writeFileSync('frontend/src/pages/Landing.jsx', topPart + newReturn + bottomPart);
console.log('Successfully updated Landing.jsx');
