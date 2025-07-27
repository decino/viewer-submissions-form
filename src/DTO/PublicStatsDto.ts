import { Name, Nullable, Property } from "@tsed/schema";

class RecordFormat {
    @Property()
    @Name("Practised")
    public practised: number;

    @Property()
    @Name("Blind")
    public blind: number;
}

class BooleanResponse {
    @Property()
    @Name("No")
    public no: number;

    @Property()
    @Name("Yes")
    public yes: number;
}

export class PublicStatsDto {
    @Property()
    @Nullable(RecordFormat)
    public recordFormat: RecordFormat | null = null;

    @Property()
    @Nullable(BooleanResponse)
    public isAuthor: BooleanResponse | null = null;

    @Property()
    @Nullable(BooleanResponse)
    public distributable: BooleanResponse | null = null;
}
