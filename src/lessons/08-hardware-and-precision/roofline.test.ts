import { describe, expect, test } from "bun:test";
import { addIntensity, decodeIntensity, matmulIntensity, minimumDevices, modelMemory, ridgePoint, roofline, storageBytes } from "./roofline";
import { accelerators } from "./specs";

describe("roofline bounds", () => {
  test("ridge has FLOPs/byte units and joins both ceilings", () => {
    const peak = 1e15;
    const bandwidth = 4e12;
    expect(ridgePoint(peak, bandwidth)).toBe(250);
    expect(roofline(peak, bandwidth, 250)).toBe(peak);
    expect(roofline(peak, bandwidth, 100)).toBe(4e14);
    expect(roofline(peak, bandwidth, 1000)).toBe(peak);
    expect(roofline(peak, bandwidth, 0)).toBe(0);
  });
  test("compute upgrades do not lift a memory-bound operation", () => {
    expect(roofline(1e15, 4e12, 10)).toBe(roofline(2e15, 4e12, 10));
    expect(roofline(1e15, 8e12, 10)).toBe(2 * roofline(1e15, 4e12, 10));
  });
  test("square matmul counts two FLOPs per FMA and three matrix transfers", () => {
    expect(matmulIntensity(3, 2)).toBe(1);
    expect(matmulIntensity(6, 2)).toBe(2);
    expect(matmulIntensity(3, 1)).toBe(2);
    expect(matmulIntensity(1024, 2)).toBeCloseTo(341.333333333);
  });
  test("add and weight-dominated decode count actual reads", () => {
    expect(addIntensity(2)).toBe(1 / 6);
    expect(addIntensity(0.5)).toBe(2 / 3);
    expect(decodeIntensity(1, 2)).toBe(1);
    expect(decodeIntensity(8, 2)).toBe(8);
    expect(decodeIntensity(8, 0.5)).toBe(32);
  });
});

describe("model memory", () => {
  test("inference bytes differ from Adam state", () => {
    expect(modelMemory(70e9, "bf16", false)).toBe(140e9);
    expect(modelMemory(70e9, "fp4", false)).toBe(35e9);
    expect(modelMemory(70e9, "nvfp4", false)).toBe(39.375e9);
    expect(modelMemory(70e9, "mxfp4", false)).toBe(37.1875e9);
    expect(modelMemory(70e9, "bf16", true)).toBe(1120e9);
    expect(modelMemory(70e9, "fp4", true)).toBe(1120e9);
    expect(storageBytes.fp16).toBe(storageBytes.bf16);
  });
  test("capacity-only device minimum rounds up at the boundary", () => {
    expect(minimumDevices(80e9, 80e9)).toBe(1);
    expect(minimumDevices(80e9 + 1, 80e9)).toBe(2);
    expect(minimumDevices(140e9, 80e9)).toBe(2);
    expect(minimumDevices(1120e9, 80e9)).toBe(14);
    expect(modelMemory(0, "bf16", true)).toBe(0);
  });
});

describe("vendor normalization", () => {
  test("dense per-GPU peaks are not sparse rack headlines", () => {
    const h100 = accelerators.find((a) => a.id === "h100")!;
    const b200 = accelerators.find((a) => a.id === "b200")!;
    const b300 = accelerators.find((a) => a.id === "b300")!;
    const gb300 = accelerators.find((a) => a.id === "gb300")!;
    expect(h100.peak.bf16).toBe(989.5);
    expect(h100.peak.fp4).toBeUndefined();
    expect(b200.peak.bf16).toBe(2250);
    expect(b200.peak.fp4).toBe(9000);
    expect(b300.peak.fp4).toBe(13500);
    expect(gb300.peak.fp4).toBe(15000);
    expect(ridgePoint(h100.peak.bf16! * 1e12, h100.bandwidth * 1e12)).toBeCloseTo(295.3731343);
  });
  test("Ironwood GiB capacity converts to decimal bytes", () => {
    const ironwood = accelerators.find((a) => a.id === "ironwood")!;
    expect(ironwood.capacity * 1e9).toBe(192 * 2 ** 30);
    expect(ironwood.peak.fp4).toBeUndefined();
  });
});
