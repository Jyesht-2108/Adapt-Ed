export interface ModuleContent {
    id: string;
    title: string;
    description: string;
    duration: string;
    difficulty: string;
    lessons: Lesson[];
    resources: Resource[];
    youtubeVideos: YouTubeVideo[];
    webScrapedContent: WebContent[];
}

export interface Lesson {
    id: string;
    title: string;
    content: string;
    type: 'video' | 'text' | 'interactive' | 'quiz';
    duration: string;
    completed: boolean;
}

export interface Resource {
    id: string;
    title: string;
    type: 'documentation' | 'tutorial' | 'article' | 'book';
    url: string;
    description: string;
}

export interface YouTubeVideo {
    id: string;
    title: string;
    videoId: string;
    channel: string;
    duration: string;
    description: string;
    thumbnail: string;
}

export interface WebContent {
    id: string;
    title: string;
    url: string;
    summary: string;
    scrapedAt: string;
    type: 'article' | 'tutorial' | 'documentation';
}

// Mock module content data
export const mockModuleContent: Record<string, ModuleContent> = {
    "JavaScript Fundamentals": {
        id: "javascript-fundamentals",
        title: "JavaScript Fundamentals",
        description: "Master the basics of JavaScript programming including variables, functions, and control structures.",
        duration: "2 weeks",
        difficulty: "Beginner",
        lessons: [
            {
                id: "js-1",
                title: "Variables and Data Types",
                content: `# Variables and Data Types in JavaScript

## Introduction
JavaScript has several data types that you need to understand:

### Primitive Types:
- **String**: Text data
- **Number**: Numeric data  
- **Boolean**: true/false values
- **Undefined**: Variable declared but not assigned
- **Null**: Intentional absence of value
- **Symbol**: Unique identifier (ES6+)
- **BigInt**: Large integers (ES2020+)

### Examples:
\`\`\`javascript
// String
let name = "John Doe";
let message = 'Hello World';

// Number
let age = 25;
let price = 99.99;

// Boolean
let isActive = true;
let isComplete = false;

// Undefined
let undefinedVar;
console.log(undefinedVar); // undefined

// Null
let emptyValue = null;
\`\`\`

## Variable Declarations
JavaScript has three ways to declare variables:

### var (function-scoped)
\`\`\`javascript
var oldWay = "function scoped";
\`\`\`

### let (block-scoped)
\`\`\`javascript
let modernWay = "block scoped";
\`\`\`

### const (block-scoped, immutable)
\`\`\`javascript
const CONSTANT_VALUE = "cannot be reassigned";
\`\`\`

## Practice Exercise
Try creating variables of different types and logging them to the console.`,
                type: "text",
                duration: "30 min",
                completed: false
            },
            {
                id: "js-2",
                title: "Functions and Scope",
                content: `# Functions and Scope

## Function Declarations
\`\`\`javascript
function greet(name) {
  return "Hello, " + name + "!";
}
\`\`\`

## Function Expressions
\`\`\`javascript
const greet = function(name) {
  return "Hello, " + name + "!";
};
\`\`\`

## Arrow Functions (ES6+)
\`\`\`javascript
const greet = (name) => {
  return "Hello, " + name + "!";
};

// Shorter syntax for single expressions
const greet = name => "Hello, " + name + "!";
\`\`\`

## Scope
- **Global Scope**: Variables accessible everywhere
- **Function Scope**: Variables accessible within function
- **Block Scope**: Variables accessible within block (let/const)

## Closures
Functions can access variables from their outer scope:

\`\`\`javascript
function outerFunction(x) {
  return function innerFunction(y) {
    return x + y;
  };
}

const addFive = outerFunction(5);
console.log(addFive(3)); // 8
\`\`\``,
                type: "text",
                duration: "45 min",
                completed: false
            },
            {
                id: "js-3",
                title: "Arrays and Objects",
                content: `# Arrays and Objects

## Arrays
Arrays store multiple values in a single variable:

\`\`\`javascript
// Array creation
let fruits = ["apple", "banana", "orange"];
let numbers = [1, 2, 3, 4, 5];

// Array methods
fruits.push("grape");        // Add to end
fruits.pop();               // Remove from end
fruits.unshift("mango");    // Add to beginning
fruits.shift();             // Remove from beginning

// Array iteration
fruits.forEach(fruit => {
  console.log(fruit);
});

// Array methods
let doubled = numbers.map(num => num * 2);
let evens = numbers.filter(num => num % 2 === 0);
let sum = numbers.reduce((acc, num) => acc + num, 0);
\`\`\`

## Objects
Objects store key-value pairs:

\`\`\`javascript
// Object creation
let person = {
  name: "John",
  age: 30,
  city: "New York",
  greet: function() {
    return "Hello, I'm " + this.name;
  }
};

// Accessing properties
console.log(person.name);        // Dot notation
console.log(person["age"]);      // Bracket notation

// Adding properties
person.email = "john@example.com";

// Object destructuring
const { name, age } = person;
\`\`\``,
                type: "text",
                duration: "40 min",
                completed: false
            },
            {
                id: "js-4",
                title: "Async/Await and Promises",
                content: `# Asynchronous JavaScript

## Promises
Promises handle asynchronous operations:

\`\`\`javascript
// Creating a promise
const fetchData = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve("Data fetched successfully!");
    } else {
      reject("Error fetching data");
    }
  }, 2000);
});

// Using promises
fetchData
  .then(data => console.log(data))
  .catch(error => console.error(error));
\`\`\`

## Async/Await
Modern syntax for handling promises:

\`\`\`javascript
async function getData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Using async function
getData().then(data => console.log(data));
\`\`\`

## Fetch API
Modern way to make HTTP requests:

\`\`\`javascript
// GET request
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => response.json())
  .then(data => console.log(data));

// POST request
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'New Post',
    body: 'This is a new post',
    userId: 1
  })
})
.then(response => response.json())
.then(data => console.log(data));
\`\`\``,
                type: "text",
                duration: "50 min",
                completed: false
            }
        ],
        resources: [
            {
                id: "mdn-js",
                title: "MDN JavaScript Guide",
                type: "documentation",
                url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
                description: "Comprehensive JavaScript documentation from Mozilla"
            },
            {
                id: "js-info",
                title: "JavaScript.info",
                type: "tutorial",
                url: "https://javascript.info/",
                description: "Modern JavaScript tutorial with detailed explanations"
            },
            {
                id: "eloquent-js",
                title: "Eloquent JavaScript",
                type: "book",
                url: "https://eloquentjavascript.net/",
                description: "Free online book about JavaScript programming"
            }
        ],
        youtubeVideos: [
            {
                id: "yt-1",
                title: "JavaScript Crash Course For Beginners",
                videoId: "hdI2bqOjy3c",
                channel: "Traversy Media",
                duration: "1:40:27",
                description: "Complete JavaScript crash course covering all fundamentals",
                thumbnail: "https://img.youtube.com/vi/hdI2bqOjy3c/maxresdefault.jpg"
            },
            {
                id: "yt-2",
                title: "JavaScript ES6 Features",
                videoId: "WZQc7RUAg18",
                channel: "Programming with Mosh",
                duration: "1:23:45",
                description: "Learn modern JavaScript ES6+ features and syntax",
                thumbnail: "https://img.youtube.com/vi/WZQc7RUAg18/maxresdefault.jpg"
            },
            {
                id: "yt-3",
                title: "Async JavaScript Tutorial",
                videoId: "PoRJizFvM7s",
                channel: "The Net Ninja",
                duration: "45:32",
                description: "Master asynchronous JavaScript with promises and async/await",
                thumbnail: "https://img.youtube.com/vi/PoRJizFvM7s/maxresdefault.jpg"
            }
        ],
        webScrapedContent: [
            {
                id: "web-1",
                title: "JavaScript Best Practices 2024",
                url: "https://blog.logrocket.com/javascript-best-practices-2024/",
                summary: "Latest JavaScript best practices including modern syntax, performance optimization, and code organization techniques. Covers ES2024 features, async patterns, and memory management.",
                scrapedAt: "2024-01-15T10:30:00Z",
                type: "article"
            },
            {
                id: "web-2",
                title: "Understanding JavaScript Closures",
                url: "https://css-tricks.com/javascript-closures/",
                summary: "Deep dive into JavaScript closures with practical examples and use cases for better code organization. Learn how closures work under the hood and common pitfalls to avoid.",
                scrapedAt: "2024-01-14T15:45:00Z",
                type: "tutorial"
            },
            {
                id: "web-3",
                title: "JavaScript Performance Optimization",
                url: "https://web.dev/fast/",
                summary: "Comprehensive guide to optimizing JavaScript performance including bundle size, execution speed, and memory usage. Techniques for lazy loading, code splitting, and efficient DOM manipulation.",
                scrapedAt: "2024-01-13T09:20:00Z",
                type: "documentation"
            }
        ]
    }
};
