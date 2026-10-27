import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MotorPanel } from "../components/MotorPanel.js";
import { MotorCommand } from "@maze/shared";

describe("MotorPanel Component", () => {
  it("renders commanded PWM and motor direction without pretending to have encoders", () => {
    const mockCommand: MotorCommand = {
      leftDirection: "FORWARD",
      rightDirection: "FORWARD",
      leftPwm: 200,
      rightPwm: 200,
      action: "FORWARD",
    };

    const { getByText, getAllByText } = render(<MotorPanel command={mockCommand} />);

    expect(getByText("L298N Dual DC Motor Driver")).toBeInTheDocument();
    expect(getAllByText("FORWARD").length).toBeGreaterThan(0);
    expect(getAllByText(/200/).length).toBe(2);
    expect(getByText(/does not have wheel encoders/i)).toBeInTheDocument();
  });
});

