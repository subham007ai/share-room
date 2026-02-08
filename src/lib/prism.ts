import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';

export const detectLanguage = (code: string): string => {
  if (/^\s*import\s+.*\s+from\s+['"]/.test(code) || /^\s*export\s+(default\s+)?/.test(code)) {
    return 'typescript';
  }
  if (/^\s*def\s+\w+\s*\(/.test(code) || /^\s*class\s+\w+\s*:/.test(code)) {
    return 'python';
  }
  if (/^\s*public\s+(static\s+)?class\s+/.test(code) || /^\s*package\s+/.test(code)) {
    return 'java';
  }
  if (/^\s*#include\s*</.test(code)) {
    return code.includes('iostream') || code.includes('vector') ? 'cpp' : 'c';
  }
  if (/^\s*func\s+\w+\s*\(/.test(code) || /^\s*package\s+main/.test(code)) {
    return 'go';
  }
  if (/^\s*fn\s+\w+\s*\(/.test(code) || /^\s*use\s+\w+::/.test(code)) {
    return 'rust';
  }
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s+/i.test(code)) {
    return 'sql';
  }
  if (/^\s*\{[\s\S]*"[\w]+"\s*:/.test(code)) {
    return 'json';
  }
  if (/^\s*<\w+[\s>]/.test(code)) {
    return 'html';
  }
  if (/^\s*\$\s+/.test(code) || /^\s*(#!\/.*)?bash/.test(code)) {
    return 'bash';
  }
  return 'javascript';
};

export const highlightCode = (code: string, language?: string): string => {
  const lang = language || detectLanguage(code);
  const grammar = Prism.languages[lang] || Prism.languages.javascript;
  return Prism.highlight(code, grammar, lang);
};

export { Prism };
