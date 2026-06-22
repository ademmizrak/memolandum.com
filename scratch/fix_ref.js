const fs = require('fs');
let content = fs.readFileSync('D:/000Memorade/index.html', 'utf8');

const targetStr = `    function DesktopPortal({ language, langPair, setLangPair, toggleLanguage, activeShell, setActiveShell, activeCategory, setActiveCategory, setIsDesktopMode, setLanguage, handleLaunchMode }) {
      const handleShellSelect = (shell) => {`;

const replacementStr = `    function DesktopPortal({ language, langPair, setLangPair, toggleLanguage, activeShell, setActiveShell, activeCategory, setActiveCategory, setIsDesktopMode, setLanguage, handleLaunchMode }) {
      const middleColRef = React.useRef(null);
      React.useEffect(() => {
        const gameContainer = document.getElementById('game-container');
        const middleCol = middleColRef.current;
        if (gameContainer && middleCol) {
          middleCol.appendChild(gameContainer);
          return () => {
            const rootEl = document.getElementById('root');
            if (rootEl && rootEl.parentNode) {
              rootEl.parentNode.insertBefore(gameContainer, rootEl);
            } else {
              document.body.appendChild(gameContainer);
            }
          };
        }
      }, []);

      const handleShellSelect = (shell) => {`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('D:/000Memorade/index.html', content, 'utf8');
