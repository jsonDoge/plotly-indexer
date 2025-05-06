# Node.js TypeScript Script Runner

This project is a barebone Node.js TypeScript script runner that allows you to execute TypeScript scripts using Node.js.

## Project Structure

```
node-ts-runner
├── src
│   └── index.ts        # Entry point for the script runner
├── package.json        # Configuration for pnpm and project dependencies
├── tsconfig.json       # TypeScript configuration file
├── pnpm-lock.yaml      # Lock file for pnpm
└── README.md           # Project documentation
```

## Getting Started

To set up the project, follow these steps:

1. **Install pnpm** (if you haven't already):

   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:

   Navigate to the project directory and run:

   ```bash
   pnpm install
   ```

3. **Build the TypeScript files**:

   You can build the TypeScript files by running:

   ```bash
   pnpm run build
   ```

4. **Run the script runner**:

   To execute your TypeScript scripts, use:

   ```bash
   pnpm run start
   ```

## Usage

You can add your TypeScript scripts in the `src` directory and modify the `index.ts` file to include the logic for executing those scripts.

## License

This project is licensed under the MIT License.