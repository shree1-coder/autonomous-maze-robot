import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MazeGrid } from "../components/MazeGrid.js";
import { MazeConfig } from "@maze/shared";

describe("MazeGrid Component", () => {
  const config: MazeConfig = {
    rows: 4,
    cols: 4,
    start: { row: 3, col: 0 },
    goal: { row: 0, col: 3 },
    initialDirection: "NORTH",
  };

  it("renders SVG grid canvas with correct start and goal markers", () => {
    const { getByText, container } = render(
      <MazeGrid config={config} displayMode="GROUND_TRUTH" />
    );

    expect(getByText("S")).toBeInTheDocument();
    expect(getByText("G")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders robot at specified position", () => {
    const { container } = render(
      <MazeGrid
        config={config}
        robotPos={{ row: 3, col: 0 }}
        robotFacing="NORTH"
      />
    );
    // Robot polygon arrow exists
    const polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBeGreaterThan(0);
  });
});

