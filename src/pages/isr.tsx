import { GetStaticProps, GetStaticPropsResult } from 'next'
import Body, { BodyProps } from '../components/Body'

import Header from '../components/Header'


let buildId = 0

interface Props extends BodyProps {}

const IsrPage = ({ time, number }: Props) => {

  return (
    <>
      <Header />
      <Body number={number}  time={time} />
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  buildId += 1

  const result: GetStaticPropsResult<Props> = {
    props: {
      time: Date.now().toString(),
      number: buildId,
    },
    revalidate: 5,
  }

  return result
}

export default IsrPage
