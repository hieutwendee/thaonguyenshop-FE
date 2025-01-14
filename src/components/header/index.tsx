"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Icons } from "../icons";
import ThaoNguyenLogo from "@images/logo/thao-nguyen-logo.png";
import { NavBarRoute } from "@/constant/route";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import { CloseButton, Drawer, Input, UnstyledButton } from "@mantine/core";
import { useRecoilState } from "recoil";
import { filterProductState } from "@/store/state/product-filter.atom";
import LoginModal from "../login-modal";
import { ATOM_KEY } from "@/store/key";
import { Search } from "lucide-react";
import Image from "next/image";

const Header = () => {
  const router = useRouter();
  const [productParam, setProductParam] = useRecoilState(filterProductState);
  const keywordIntial =
    typeof window !== "undefined" &&
    JSON.parse(sessionStorage.getItem(ATOM_KEY.FILTER_PRODUCT) || "{}");
  const [keyword, setKeyword] = React.useState(keywordIntial?.keyword || "");
  const pathname = usePathname();
  const path = useMemo(() => pathname.split("/")[1], [pathname]);
  const [onpenedMenu, { open: openMenu, close: closeMenu }] =
    useDisclosure(false);

  const handleChangeKeyword = () => {
    setProductParam((prev) => ({
      ...prev,
      keyword: keyword,
    }));
    if (pathname !== "/san-pham") router.push(`/san-pham?search=${keyword}`);
    closeMenu();
  };

  return (
    <div>
      <div className="hidden xl:block h-11 bg-[#35A8E0]">
        <div className="h-full flex max-w-6xl mx-auto items-center justify-between text-white">
          <div>
            <h2 className="text-sm">Tổng kho Thao Nguyen</h2>
          </div>
          <LoginModal onClose={closeMenu} />
        </div>
      </div>
      <div>
        <div className="h-full  flex gap-11 max-w-6xl mx-auto items-center justify-between">
          <Link
            href="/"
            className="basis-[147px]"
            onClick={() => setKeyword("")}
          >
            <Image src={ThaoNguyenLogo} alt="Thao Nguyen" />
          </Link>
          <div className="hidden xl:flex flex-1 flex-col mt-2">
            <div className="flex items-center justify-between gap-20">
              <div className="flex w-full items-center">
                <Input
                  placeholder="Tìm kiếm sản phẩm bạn muốn mua tại đây"
                  className="flex-1 h-full rounded-none"
                  radius="xs"
                  value={keyword}
                  onChange={(event) => setKeyword(event.currentTarget.value)}
                  rightSectionPointerEvents="all"
                  rightSection={
                    <CloseButton
                      aria-label="Clear input"
                      onClick={() => {
                        setKeyword("");
                        setProductParam((prev) => ({ ...prev, keyword: "" }));
                      }}
                      style={{ display: keyword ? undefined : "none" }}
                    />
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleChangeKeyword();
                  }}
                />
                <Button
                  type="button"
                  className="rounded-none bg-[#35A8E0] h-9"
                  onClick={handleChangeKeyword}
                >
                  TÌM KIẾM
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Icons.phone color="#35A8E0" />
                <div>
                  <h1 className="text-[#35A8E0] font-semibold">HOTLINE</h1>
                  <p className="italic text-[#e02020] font-semibold">
                    0921.367.363
                  </p>
                </div>
              </div>
            </div>
            <Separator className="bg-black h-0.5 mt-4" />
            <div className="flex gap-4">
              {NavBarRoute.map((item, index) => (
                <Link
                  key={index}
                  href={item.slug}
                  className={cn(
                    "hover:text-[#35A8E0] text-sm leading-[70px] tracking-wide",
                    path === item.slug.split("/")[1] && "text-[#35A8E0]"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="block xl:hidden">
            <UnstyledButton onClick={openMenu}>
              <Icons.menu />
            </UnstyledButton>
            <Drawer
              opened={onpenedMenu}
              onClose={closeMenu}
              overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
              styles={{
                body: {
                  height: "calc(100% - 60px)",
                },
              }}
            >
              <div className="flex flex-col pt-6 px-4 justify-between h-full">
                <div className="flex flex-col gap-4 ">
                  <div className="flex w-full items-center">
                    <Input
                      placeholder="Tìm kiếm sản phẩm bạn muốn mua tại đây"
                      className="flex-1 h-full rounded-none"
                      radius="xs"
                      size="lg"
                      value={keyword}
                      onChange={(event) =>
                        setKeyword(event.currentTarget.value)
                      }
                      rightSectionPointerEvents="all"
                      rightSection={
                        <CloseButton
                          aria-label="Clear input"
                          onClick={() => {
                            setKeyword("");
                            setProductParam((prev) => ({
                              ...prev,
                              keyword: "",
                            }));
                          }}
                          style={{ display: keyword ? undefined : "none" }}
                        />
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleChangeKeyword();
                      }}
                    />
                    <Button
                      type="button"
                      className="rounded-none bg-[#35A8E0] h-12"
                      onClick={handleChangeKeyword}
                    >
                      <Search />
                    </Button>
                  </div>
                  {NavBarRoute.map((item, index) => (
                    <Link
                      key={index}
                      href={item.slug}
                      className={cn(
                        "hover:text-[#35A8E0] text-lg tracking-wide text-black",
                        path === item.slug.split("/")[1] && "text-[#35A8E0]"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
                <LoginModal onClose={closeMenu} />
              </div>
            </Drawer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
