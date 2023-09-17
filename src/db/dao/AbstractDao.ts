import {DataSource, EntityManager, EntityTarget, Repository} from "typeorm";
import type {ObjectLiteral} from "typeorm/common/ObjectLiteral";

export abstract class AbstractDao<T extends ObjectLiteral> {

    private readonly dao: Repository<T>;

    protected constructor(protected readonly ds: DataSource, model: EntityTarget<T>) {
        this.dao = ds.getRepository(model);
    }

    public get dataSource(): DataSource {
        return this.ds;
    }

    protected getEntityManager(transaction?: EntityManager): Repository<T> {
        return transaction ? transaction.getRepository(this.dao.target) : this.dao;
    }

}
