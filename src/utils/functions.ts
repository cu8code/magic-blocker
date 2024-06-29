const selectRandomElementFromArray = <T>(arr: T[]): T => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

const generateUniqueId = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${randomStr}`;
}

function createTemporaryInterval(
    callback: () => void,
    intervalTime: number,
    destroyTime: number
): void {
    // Create the interval
    const intervalId = setInterval(callback, intervalTime);

    // Set a timeout to clear the interval
    setTimeout(() => {
        clearInterval(intervalId);
        console.log('Interval destroyed');
    }, destroyTime);
}

export { selectRandomElementFromArray, generateUniqueId, createTemporaryInterval }
