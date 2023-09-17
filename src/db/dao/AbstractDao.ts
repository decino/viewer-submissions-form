import {EntityManager, EntityTarget, Repository} from "typeorm";
import type {ObjectLiteral} from "typeorm/common/ObjectLiteral";

export abstract class AbstractDao<T extends ObjectLiteral> {

    protected dao: Repository<T>;

    protected getTransaction(model: EntityTarget<T>, transaction?: EntityManager): Repository<T> {
        return transaction ? transaction.getRepository(model) : this.dao;
    }


}
