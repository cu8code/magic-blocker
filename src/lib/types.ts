export interface Data {
    question: string;
    solution: string;
    difficulty: "HARD" | "MEDIUM" | "EASY";
    source?: string;
    hints?: string;
    coverImage?: string;
}


/**
 * Define the interfaces for the fetched data
 */
export interface MetaData {
    length: number;
    type: "string";
    name: string;
    author: string;
    description: string;
    email: string;
    twitter?: string;
    github?: string;
    youtube?: string;
    discord?: string;
}

export interface Box {
    one: Data[];
    two: Data[];
    three: Data[];
}