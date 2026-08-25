# Workspace Utility

A powerful, client-side React application for analyzing, managing, and visualizing your file workspace.

## Features

- **File Inventory**: View all files with extensive filtering, sorting, and metadata analysis.
- **Duplicate Detection**: Instantly find exact file matches based on SHA-256 cryptographic hashes.
- **Deduplication**: Execute bulk deduplication plans with rule-based resolution (e.g., keep oldest, newest, or shortest path).
- **Workspace Insights**: Visualize file extensions, size histograms, and redundancy overviews.
- **Directory Tree**: Browse files hierarchically with visual storage allocation indicators.
- **Interactive Dependency Map**: Visualize code dependencies and imports using a D3.js force-directed graph.
- **Side-by-Side Comparison**: Compare file metadata and content differences (diff view for text files).
- **Keyboard Navigation**: Navigate the file inventory seamlessly with keyboard shortcuts.

## Prerequisites

- Node.js (v18+)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- **Loading files**: Click "Select Workspace Folder" to load a local directory. All analysis is performed locally in your browser.
- **Shortcuts**: Press `Ctrl + K` to view keyboard shortcuts.
- **Filtering**: Use the search bar or chart segments to filter the file list.
- **Bulk Actions**: Select multiple files to reveal bulk tag, rename, delete, and copy path actions.
