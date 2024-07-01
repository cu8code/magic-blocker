# Magic Block

Magic Block is a Chrome extension designed to combat distractions in a unique manner. It restricts access to specified websites until users solve a designated task, promoting better focus and leveraging spaced repetition for enhanced learning habits. Users can create and share custom datasets once the project reaches completion.

## Features

- [x] Functional synchronization clock with popup and background worker
- [x] Template and loader for creating datasets
- [ ] Store and selection menu for using any custom dataset
- [ ] Settings page for custom time interval selection
- [ ] Ability to delete, edit, and manage datasets locally

## Usage

Since the extension has not been released on any platform yet, there are two methods to set it up:

### Using Our Testing Release Zip

1. Download the zip file.
2. Navigate to `chrome://extensions` in your Chrome browser.
3. Enable `Developer mode` located at the top right-hand corner.
   ![Developer Mode](https://github.com/cu8code/magic-blocker/assets/109351887/3cb306ba-a60d-488c-b34e-36f37dbe0020)
4. Download this file [chrome-mv3-prod.zip](https://github.com/cu8code/magic-blocker/releases).
5. Unzip the file.
6. Click on `Load unpacked` and select the root directory of the unzipped files.

### For Developers

1. Clone the repository: `git clone git@github.com:cu8code/magic-blocker.git`.
2. Install dependencies using `pnpm install` (please use `pnpm`).
3. For Chrome MV3:
   - Run development mode: `pnpm run dev --target=chrome-mv3`.
4. For Chrome MV2:
   - Run development mode: `pnpm run dev --target=chrome-mv2`.
5. For Firefox (MV3):
   - Download [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/).
   - Run development mode: `pnpm run dev --target=firefox-mv3`.
6. For testing:
   - Run tests: `pnpm test`.

## Contribution

Feel free to explore the code, make improvements, and submit a pull request. It's recommended to create an issue beforehand as contributions involve a collaborative process. As long as the code meets the project's standards, contributions are welcomed.

![Untitled-2024-07-01-1017](https://github.com/cu8code/magic-blocker/assets/109351887/fb520c35-7d2d-4f97-99b7-c3c6a772aadb)

