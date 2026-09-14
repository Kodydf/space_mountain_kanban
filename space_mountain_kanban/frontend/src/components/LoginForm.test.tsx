import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import * as authApi from "@/lib/auth-api";

vi.mock("@/lib/auth-api", () => ({
  login: vi.fn(),
}));

describe("LoginForm", () => {
  it("calls onSuccess with the user after a successful login", async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ username: "user" });
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authApi.login).toHaveBeenCalledWith("user", "password");
    expect(onSuccess).toHaveBeenCalledWith({ username: "user" });
  });

  it("shows an error message on failed login", async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("bad creds"));
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Username"), "user");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("disables sign in until both fields are filled", async () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Username"), "user");
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Password"), "password");
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });
});
