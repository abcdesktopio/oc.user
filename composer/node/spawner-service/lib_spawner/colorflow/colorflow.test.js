const colorflow  = require('./colorflow');

test("Should throw an error because the image doesn't exists", () => {
    expect( () => colorflow("noexist.png")).toThrow("No such file or directory");
});


test("Properly calculate background color for jpeg format", () => {
    expect(colorflow("images/red.jpeg")).toBe("#FE0000");
    expect(colorflow("images/green.jpeg")).toBe("#00FF01");
    expect(colorflow("images/blue.jpeg")).toBe("#0000FE");
    expect(colorflow("images/black.jpeg")).toBe("#000000");
    expect(colorflow("images/white.jpeg")).toBe("#FFFFFF");
    expect(colorflow("images/mountain.jpeg")).toBe("#629DC1");
});


test("Properly calculate background color for png format", () => {
    expect(colorflow("images/red.png")).toBe("#FF0000");
    expect(colorflow("images/green.png")).toBe("#00FF00");
    expect(colorflow("images/blue.png")).toBe("#0000FF");
    expect(colorflow("images/black.png")).toBe("#000000");
    expect(colorflow("images/white.png")).toBe("#FFFFFF");
    expect(colorflow("images/road.png")).toBe("#506871");
});


test("Properly calculate background color for bmp format", () => {
    expect(colorflow("images/red.bmp")).toBe("#FF0000");
    expect(colorflow("images/green.bmp")).toBe("#00FF00");
    expect(colorflow("images/blue.bmp")).toBe("#0000FF");
    expect(colorflow("images/black.bmp")).toBe("#000000");
    expect(colorflow("images/white.bmp")).toBe("#FFFFFF");
    expect(colorflow("images/lake.bmp")).toBe("#BBB2B6");
});
