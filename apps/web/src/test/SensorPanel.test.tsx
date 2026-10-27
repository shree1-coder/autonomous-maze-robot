import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SensorPanel } from "../components/SensorPanel.js";
import { RobotSensors } from "@maze/shared";

describe("SensorPanel Component", () => {
  it("renders 3 digital IR sensors with raw status and interpreted state", () => {
    const mockSensors: RobotSensors = {
      left: { raw: "LOW", state: "BLOCKED", timestamp: Date.now(), stale: false },
      front: { raw: "HIGH", state: "CLEAR", timestamp: Date.now(), stale: false },
      right: { raw: "HIGH", state: "CLEAR", timestamp: Date.now(), stale: false },
    };

    const { getByText, getAllByText } = render(<SensorPanel sensors={mockSensors} />);

    expect(getByText("Left IR")).toBeInTheDocument();
    expect(getByText("Front IR")).toBeInTheDocument();
    expect(getByText("Right IR")).toBeInTheDocument();

    expect(getByText("BLOCKED")).toBeInTheDocument();
    expect(getAllByText("CLEAR").length).toBe(2);

    expect(getByText("LOW")).toBeInTheDocument();
    expect(getAllByText("HIGH").length).toBe(2);
  });
});

