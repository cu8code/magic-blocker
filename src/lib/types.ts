export interface Data {
    question: string;
    answer: string;
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