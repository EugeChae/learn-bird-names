import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlagPhotoButton from "@/components/FlagPhotoButton";
import {
  createFlagStore,
  createFakeStorage,
  flagPhoto,
  getFlags,
  type FlagDeps,
} from "@/lib/photoFlags.store";

const PHOTO = {
  speciesId: "pica-serica",
  nameKorean: "까치",
  photoUrl: "https://example.com/magpie.jpg",
};

function freshDeps(): FlagDeps {
  return {
    store: createFlagStore(createFakeStorage()),
    now: new Date("2026-08-23T00:00:00.000Z"),
  };
}

describe("FlagPhotoButton", () => {
  it("초기엔 미플래그 상태로 보인다", () => {
    render(<FlagPhotoButton {...PHOTO} deps={freshDeps()} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("사진 별로예요");
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("누르면 변경요청됨으로 토글되고 스토어에 저장된다", async () => {
    const deps = freshDeps();
    render(<FlagPhotoButton {...PHOTO} deps={deps} />);
    const btn = screen.getByRole("button");

    await userEvent.click(btn);
    expect(btn).toHaveTextContent("변경요청됨");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(getFlags(deps).map((f) => f.photoUrl)).toEqual([PHOTO.photoUrl]);

    await userEvent.click(btn);
    expect(btn).toHaveTextContent("사진 별로예요");
    expect(getFlags(deps)).toEqual([]);
  });

  it("이미 플래그된 사진은 변경요청됨 상태로 마운트된다", async () => {
    const deps = freshDeps();
    flagPhoto(PHOTO, deps);
    render(<FlagPhotoButton {...PHOTO} deps={deps} />);
    expect(await screen.findByText("변경요청됨")).toBeInTheDocument();
  });
});
