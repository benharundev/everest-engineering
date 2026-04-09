export declare class PaginationDto {
    offset: number;
    limit: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    offset: number;
    limit: number;
}
