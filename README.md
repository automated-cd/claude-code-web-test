# Educational Games Hub

An interactive learning platform featuring educational games designed to teach software engineering concepts through hands-on practice.

## Overview

This project provides a collection of browser-based educational games that help developers and students learn important software engineering concepts in an engaging, interactive way.

## Features

### Available Games

1. **Prompt Engineer's Toolkit** - Master the art of crafting effective prompts by combining the right techniques across 5 progressive levels

2. **Clone This App** - Develop your UI component recognition skills by reverse-engineering popular app interfaces through 5 different challenges

3. **EARS Requirements Builder** - Learn to build proper EARS (Easy Approach to Requirements Syntax) requirements by dragging components into correct slots across 20 levels

4. **Integration Matcher** - Understand essential development tools by matching development goals with the right integrations through 6 levels

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No additional dependencies required

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd claude-code-web-test
```

2. Open `index.html` in your web browser, or serve it using a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

### Usage

Simply click on any game card from the main hub to start playing. Each game includes:
- Progressive difficulty levels
- Interactive tutorials
- Immediate feedback
- Progress tracking

## Project Structure

```
claude-code-web-test/
├── index.html              # Main hub page
├── games/
│   ├── prompt-engineer/    # Prompt engineering game
│   ├── clone-this-app/     # UI component recognition game
│   ├── ears-builder/       # EARS requirements game
│   └── integration-matcher/# Integration matching game
├── CLAUDE.md              # Coding best practices guide
└── README.md              # This file
```

## Development

This is a static web application built with vanilla HTML, CSS, and JavaScript. No build process or package manager is required.

### Code Quality

This project follows the best practices outlined in [CLAUDE.md](CLAUDE.md), including:
- Clean, readable code
- Meaningful naming conventions
- Proper error handling
- Comprehensive documentation

## Contributing

Contributions are welcome! Please ensure your code follows the best practices outlined in CLAUDE.md.

## License

This project is part of the Claude Code web testing suite.