import { useState, useEffect } from 'react';

const fakeOutput = [
  'Compiling project...',
  '[1/4] Resolving dependencies...',
  '[2/4] Compiling main.c',
  '[3/4] Linking objects...',
  '[4/4] Generating executable...',
  '',
  'Build successful!',
  '',
  '> Running tests...',
  '',
  'test_addition ............ PASSED',
  'test_subtraction ......... PASSED',
  'test_multiplication ...... PASSED',
  'test_division ............ PASSED',
  'test_edge_cases .......... PASSED',
  '',
  'All 5 tests passed.',
  '',
  '> ./main',
  'Enter first number: 42',
  'Enter second number: 23',
  'Result: 65',
  '',
  'Program exited with code 0',
];

export const FakeScreen = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    if (currentLine < fakeOutput.length) {
      const timeout = setTimeout(() => {
        setLines((prev) => [...prev, fakeOutput[currentLine]]);
        setCurrentLine((prev) => prev + 1);
      }, Math.random() * 200 + 100);
      return () => clearTimeout(timeout);
    }
  }, [currentLine]);

  return (
    <div className="min-h-screen bg-black p-4 font-mono text-green-500">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 text-gray-500">
          GNU GCC Compiler v11.4.0 - Ubuntu 22.04
        </div>
        <div className="space-y-1">
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line || '\u00A0'}
            </div>
          ))}
          <span className="animate-pulse">▊</span>
        </div>
      </div>
    </div>
  );
};
