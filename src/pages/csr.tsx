import useSWR from "swr";

import Header from "../components/Header";
import Body, { BodyProps } from "../components/Body"

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CsrPage = () => {
  const { data, error } = useSWR<BodyProps>('/api', fetcher);

  if (error) {
      return <div>Failed to load ({ error })</div>
  }

  return (
    <>
      <Header />
      {data ? (
          <Body number={data.number} time={data.time} />
      ) : (
          <p>Loading...</p>
      )}
    </>
  );
};

export default CsrPage;
