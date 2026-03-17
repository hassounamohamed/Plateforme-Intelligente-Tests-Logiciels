"use client";

import { ActionIcon, Menu, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { useMounted } from "@mantine/hooks";

export function ThemeModeToggle() {
  const mounted = useMounted();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("dark", {
    getInitialValueInEffect: true,
  });

  const safeColorScheme = mounted ? colorScheme : "auto";
  const safeComputedColorScheme = mounted ? computedColorScheme : "dark";

  const icon =
    safeColorScheme === "auto"
      ? "brightness_auto"
      : safeComputedColorScheme === "dark"
      ? "dark_mode"
      : "light_mode";

  return (
    <Menu shadow="md" width={210} position="bottom-end" withArrow>
      <Menu.Target>
        <Tooltip label="Theme mode" withArrow>
          <ActionIcon
            variant="gradient"
            gradient={{ from: "cyan", to: "blue", deg: 135 }}
            size="lg"
            radius="md"
            aria-label="Toggle theme mode"
          >
            <span suppressHydrationWarning className="material-symbols-outlined text-white">{icon}</span>
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Appearance</Menu.Label>
        <Menu.Item
          leftSection={<span className="material-symbols-outlined text-[18px]">light_mode</span>}
          rightSection={colorScheme === "light" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
          onClick={() => setColorScheme("light")}
        >
          Light
        </Menu.Item>
        <Menu.Item
          leftSection={<span className="material-symbols-outlined text-[18px]">dark_mode</span>}
          rightSection={colorScheme === "dark" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
          onClick={() => setColorScheme("dark")}
        >
          Dark
        </Menu.Item>
        <Menu.Item
          leftSection={<span className="material-symbols-outlined text-[18px]">brightness_auto</span>}
          rightSection={colorScheme === "auto" ? <span className="material-symbols-outlined text-[16px]">check</span> : null}
          onClick={() => setColorScheme("auto")}
        >
          Intelligent (Auto)
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
