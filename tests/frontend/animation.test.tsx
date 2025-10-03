import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";

describe("Animations", () => {
  it("does not render the temporary Lottie animation on Home anymore", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    // Animation was removed, ensure no img role with that label exists
    const animation = screen.queryByRole("img", { name: /developer yoga/i });
    expect(animation).toBeNull();
  });
});
