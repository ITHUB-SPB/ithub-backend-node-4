export abstract class BaseRepository {
    protected abstract readonly name: string
}

export abstract class ProductsRepository extends BaseRepository {
    abstract getAll(input: import('../schemas/products.schema.js').GetManyProductsQuery): Promise<unknown>
    abstract getOne(id: number): Promise<unknown | null>
    abstract getOwnerId(id: number): Promise<number | null>
    abstract add(input: import('../schemas/products.schema.js').CreateProductBody, accountId: number, imageUrl: string | null): Promise<unknown>
    abstract update(id: number, input: import('../schemas/products.schema.js').UpdateProductBody, imageUrl?: string): Promise<unknown>
}

export abstract class AccountsRepository extends BaseRepository {
    abstract add(email: string, password: string): Promise<unknown>
    abstract getByEmail(email: string): Promise<unknown | null>
    abstract getAll(page: number, limit: number): Promise<unknown>
    abstract getOne(id: number): Promise<unknown | null>
    abstract getId(id: number): Promise<number | null>
    abstract saveProfile(id: number, bio: string, avatar?: string): Promise<unknown>
}
