import { DataSource, EntityManager, EntityTarget, type ObjectLiteral, Repository as Dao } from "typeorm";

export abstract class AbstractDao<T extends ObjectLiteral> {
    private readonly dao: Dao<T>;

    protected constructor(
        protected readonly ds: DataSource,
        model: EntityTarget<T>,
    ) {
        this.dao = ds.getRepository(model);
    }

    public get dataSource(): DataSource {
        return this.ds;
    }

    protected getEntityManager(transaction?: EntityManager): Dao<T> {
        return transaction ? transaction.getRepository(this.dao.target) : this.dao;
    }
}
