import { CollectionOf, Description, Name, Property } from "@tsed/schema";

export class UploadConfigDto {
    @Property()
    @Name("fileSizeLimitMb")
    @Description("The largest WAD that can be uploaded, in megabytes")
    public fileSizeLimitMb: number;

    @Name("allowedExtensions")
    @Description("File extensions that may be uploaded, without the dot")
    @CollectionOf(String)
    public allowedExtensions: string[];
}
