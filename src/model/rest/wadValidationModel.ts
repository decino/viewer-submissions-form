import {CollectionOf, Default, Property, Required} from "@tsed/schema";
import {AfterDeserialize} from "@tsed/json-mapper";
import {BadRequest} from "@tsed/exceptions";

@AfterDeserialize((data: WadValidationModel) => {
    const {allowedExtensionsZip, allowedHeadersZip, allowedHeaders, allowedExtensions} = data;
    if (allowedExtensions.length !== allowedHeaders.length) {
        throw new BadRequest("Extensions and headers must contain equal entries");
    }
    if (allowedExtensionsZip.length !== allowedHeadersZip.length) {
        throw new BadRequest("Zip extensions and headers must contain equal entries");
    }
    data.allowedHeaders = allowedHeaders.map(header => decodeURIComponent(header));
    data.allowedHeadersZip = allowedHeadersZip.map(header => decodeURIComponent(header));
    return data;
})
export class WadValidationModel {

    @Required()
    @Property()
    @CollectionOf(String)
    @Default([])
    public allowedExtensions: string[] = [];

    @Required()
    @Property()
    @CollectionOf(String)
    @Default([])
    public allowedHeaders: string[] = [];

    @Required()
    @Property()
    @CollectionOf(String)
    @Default([])
    public allowedExtensionsZip: string[] = [];

    @Required()
    @Property()
    @CollectionOf(String)
    @Default([])
    public allowedHeadersZip: string[] = [];
}
