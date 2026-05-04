import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword, validateGiftBox } from "@/lib/validation";

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBeNull();
    expect(validateEmail("name+tag@sub.domain.org")).toBeNull();
  });

  it("rejects missing @", () => {
    expect(validateEmail("notanemail")).not.toBeNull();
  });

  it("rejects bare @ with no domain", () => {
    expect(validateEmail("a@b")).not.toBeNull();
  });

  it("rejects double @", () => {
    expect(validateEmail("a@@b.com")).not.toBeNull();
  });

  it("rejects empty string", () => {
    expect(validateEmail("")).not.toBeNull();
  });

  it("rejects email with spaces", () => {
    expect(validateEmail("user @example.com")).not.toBeNull();
  });
});

describe("validatePassword", () => {
  it("accepts strong passwords", () => {
    expect(validatePassword("SecurePass1")).toBeNull();
    expect(validatePassword("MyP@ssw0rd")).toBeNull();
  });

  it("rejects password shorter than 8 chars", () => {
    expect(validatePassword("Ab1")).not.toBeNull();
  });

  it("rejects password without uppercase", () => {
    expect(validatePassword("password1")).not.toBeNull();
  });

  it("rejects password without digit", () => {
    expect(validatePassword("PasswordOnly")).not.toBeNull();
  });

  it("rejects empty password", () => {
    expect(validatePassword("")).not.toBeNull();
  });

  it("rejects common weak passwords", () => {
    expect(validatePassword("12345678")).not.toBeNull();
    expect(validatePassword("aaaaaaaa")).not.toBeNull();
  });
});

describe("validateGiftBox", () => {
  const valid = { recipientEmail: "anna@example.com", occasion: "День рождения" };

  it("accepts valid data", () => {
    expect(validateGiftBox(valid)).toBeNull();
  });

  it("rejects invalid recipient email", () => {
    expect(validateGiftBox({ ...valid, recipientEmail: "notanemail" })).not.toBeNull();
  });

  it("rejects empty occasion", () => {
    expect(validateGiftBox({ ...valid, occasion: "" })).not.toBeNull();
  });

  it("rejects negative budget", () => {
    expect(validateGiftBox({ ...valid, budget: "-500" })).not.toBeNull();
  });

  it("accepts optional budget", () => {
    expect(validateGiftBox({ ...valid, budget: "3000" })).toBeNull();
    expect(validateGiftBox({ ...valid, budget: "" })).toBeNull();
  });
});
