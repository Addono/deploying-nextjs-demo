import Link from "next/link";
import { useRouter } from "next/router";

const pages = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Client Side Rendering [CSR]",
    href: "/csr",
  },
  {
    name: "Server Side Rendering [SSR]",
    href: "/ssr",
  },
  {
    name: "Static Site Generation [SSG]",
    href: "/ssg",
  },
  {
    name: "Incremental Static Regeneration [ISR]",
    href: "/isr",
  },
];

const Header = () => {
  const { asPath } = useRouter();

  const menuItems = pages.map((page) => ({
    ...page,
    active: page.href === asPath,
  }));

  return (
    <div style={{ flex: "1" }}>
      <h2>
        <code>next/link</code>
      </h2>
      <ul>
        {menuItems.map(({ name, href, active }) => (
          <li key={name} style={{ fontWeight: active ? 700 : 400 }}>
            <Link href={href}>
              <a>{name}</a>
            </Link>
          </li>
        ))}
      </ul>
      <h2>
        <code>HTML anchor</code>
      </h2>
      <ul>
        {menuItems.map(({ name, href, active }) => (
          <li key={name} style={{ fontWeight: active ? 700 : 400 }}>
            <a href={href}>{name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Header;
