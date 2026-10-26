import { Description, Name, Nullable, Property } from "@tsed/schema";

export class CaptchaConfigDto {
    @Property()
    @Name("captchaType")
    @Description("Type of captcha service, null when captcha is disabled")
    @Nullable(String)
    public captchaType: string | null;

    @Property()
    @Name("siteKey")
    @Description("Captcha site key for client-side integration")
    @Nullable(String)
    public siteKey: string | null;
}
