import { sayHello } from "@/graphql/resolvers/mutations/say-hello";

describe("Hello Mutation", () => {
  it("Should call say hello mutation with name input", () => {
    expect(sayHello({}, { name: "hello" })).toBeDefined();
  });
});
