import { describe, expect, it } from "vitest";
import { captchaRequired } from "./captcha";

describe("captchaRequired", () => {
    it("asks for a captcha when Turnstile is on and has a site key", () => {
        // then
        expect(captchaRequired({ captchaType: "turnstile", siteKey: "0x4AAA" })).toBe(true);
    });

    it("does not ask for one when captcha is off", () => {
        // then
        expect(captchaRequired({ captchaType: null, siteKey: null })).toBe(false);
    });

    it("does not ask for one when Turnstile has no site key to render with", () => {
        // then
        expect(captchaRequired({ captchaType: "turnstile", siteKey: null })).toBe(false);
    });

    it("does not ask for one before the settings have loaded", () => {
        // then
        expect(captchaRequired(null)).toBe(false);
    });
});
