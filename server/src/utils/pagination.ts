import { ParsedQs } from 'qs';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
    enabled: boolean;
    page: number;
    pageSize: number;
};

export type PaginatedResponse<T> = {
    items: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

export function getPaginationParams(query: ParsedQs): PaginationParams {
    const rawPage = typeof query.page === 'string' ? query.page : undefined;
    const rawPageSize = typeof query.pageSize === 'string' ? query.pageSize : undefined;
    const enabled = rawPage !== undefined || rawPageSize !== undefined;

    const parsedPage = Number.parseInt(rawPage || String(DEFAULT_PAGE), 10);
    const parsedPageSize = Number.parseInt(rawPageSize || String(DEFAULT_PAGE_SIZE), 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
    const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? Math.min(parsedPageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    return {
        enabled,
        page,
        pageSize,
    };
}

export function paginateItems<T>(items: T[], params: PaginationParams): PaginatedResponse<T> {
    const totalItems = items.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / params.pageSize);
    const safePage = totalPages === 0 ? 1 : Math.min(params.page, totalPages);
    const startIndex = (safePage - 1) * params.pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + params.pageSize);

    return {
        items: paginatedItems,
        pagination: {
            page: safePage,
            pageSize: params.pageSize,
            totalItems,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPreviousPage: safePage > 1 && totalPages > 0,
        },
    };
}
