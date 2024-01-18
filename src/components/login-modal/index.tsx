"use client";

import {
  Button,
  Menu,
  Modal,
  PasswordInput,
  TextInput,
  Avatar,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icons } from "../icons";
import { useRouter } from "next/navigation";
import { useForm } from "@mantine/form";
import { useMutation } from "@tanstack/react-query";
import { SignInBody } from "@/types/auth";
import { signinRequest } from "@/api/auth";
import { setToken } from "@/utils";
import { TOKEN_KEY } from "@/constant/auth";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/state/auth.atom";
import { Settings } from "lucide-react";

const LoginModal = () => {
  const { isAuthenticated, user } = useRecoilValue(authState);
  const [onpenedLogin, { open: openLogin, close: closeLogin }] =
    useDisclosure(false);
  const router = useRouter();
  const signupForm = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) =>
        value.length > 0 ? null : "Vui lòng nhập tên đăng nhập",
      password: (value) => (value.length > 0 ? null : "Vui lòng nhập mật khẩu"),
    },
  });
  const mutation = useMutation({
    mutationFn: async (data: SignInBody) => await signinRequest(data),
    onSuccess: (data) => {
      setToken(TOKEN_KEY.ACCESS, data.accessToken);
      setToken(TOKEN_KEY.REFRESH, data.refreshToken);
      router.push("/");
      signupForm.reset();
      closeLogin();
    },
    onError: (error) => {
      signupForm.setFieldError(
        "password",
        (error as any).response.data.message
      );
    },
  });
  return (
    <div className="cursor-pointer">
      {isAuthenticated ? (
        <div className="flex items-center gap-2">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Avatar src={user?.avatarUrl} color="white" variant="light" />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user?.name}</Menu.Label>
              <Menu.Item
                leftSection={<Settings />}
                onClick={() => router.push("/tai-khoan/me")}
              >
                Tài khoản
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <div>Xin chào, {user?.name}</div>
        </div>
      ) : (
        <div className="flex gap-2" onClick={openLogin}>
          <Icons.user />
          <span>Đăng nhập</span>
        </div>
      )}
      <Modal
        opened={onpenedLogin}
        onClose={closeLogin}
        title="Đăng nhập"
        centered
      >
        <form
          onSubmit={signupForm.onSubmit((data) => mutation.mutateAsync(data))}
          className="max-w-md w-full flex flex-col gap-4"
        >
          <TextInput
            type="text"
            size="md"
            placeholder="Tên đăng nhập"
            {...signupForm.getInputProps("username")}
          />
          <PasswordInput
            size="md"
            placeholder="Mật khẩu"
            {...signupForm.getInputProps("password")}
          />
          <Button type="submit" className="uppercase">
            Đăng nhập
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default LoginModal;