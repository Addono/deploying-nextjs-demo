### [To The Cloud and Beyond](https://www.eficode.com/events/to-the-cloud-and-beyond)

# How to deploy Next.js - Learn to do it with various vendors

Next.js has quickly become one of the most popular web application frameworks. But the official Next.js documentation does not cover in-depth how to deploy it. In this hands-on demo you will learn how to deploy a Next.js application to various providers, and also their pros and cons.

## Overview

This repository contains the talking notes and demo material for some hands-on examples on how to deploy Next.js. You will find three kinds of files:

1.  Application source code, most notably the Next.js application code in `./src/`.
2.  A `Dockerfile` to build a container image for our application. The image is published to `ghcr.io/addono/deploying-nextjs-demo:main`.
3.  Kubernetes deployment files in `k8s`. We will be using [Kustomize](https://kustomize.io/) to generate our deployment files.

With all these resources in place, we're ready to start deploying our application to various vendors. The table below outlines various different deployment models we can use:

|                                                                                                                            | **CDN**             | **Compute**                     | **Custom Server** | **Scale down to zero** |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------- | ----------------- | ---------------------- |
| **Completely Static**<br/>AWS CloudFront / AWS S3<br/>Google Cloud Storage<br/>GitHub Pages                                | ✅ By default for most providers                  | ❌ Client side or external APIs | ❌                | ✅                     |
| **Platform-as-a-Service**<br/>Vercel<br/>Netlify<br/>AWS Amplify<br/>Serverless Next.js                                    | ✅ Global edge CDN  | ✅ Serverless Functions         | ❌                | ✅                     |
| **Container-as-a-Service or Kubernetes**<br/>Azure Web App Service<br/>AWS Fargate<br/>Google Kubernetes Engine<br/>Heroku | 🚧 Roll it yourself | ✅ Node.js server               | ✅                | ❌                     |

## Completely Static

Next.js supports creating static builds out of the box. In this mode, you cannot use any dynamically rendered or API endpoint features from the Next.js framework as it will not provision any server-side logic. The output is a static HTML export, which you can deploy through a CDN.

### Our First Build

```bash
yarn next build && yarn next export
```

<spoiler>
    <summary><b>Did it work?</b></summary>
    <details>
        <p>
        No, when running this command we will get the following error:<br/> 
        <code>
            Error: Error for page /ssr: pages with `getServerSideProps` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export
        </code>
        </p>
        <p>
            One of our pages uses Server Side Rendering. Something which isn't supported in static exports. Let's rename <code>./src/ssr.tsx</code> to <code>./src/ssr.tsx.bak</code> and try again.
        </p>
    </details>
</spoiler>

### The Result

Now that we have our static build, we can go on and see what we've got. The static export defaults to output to `./out/`, so let's start a local webserver and see how it behaves:

```bash
npx serve ./out/
```

When we now navigate to [`http://localhost:5000`](http://localhost:5000) we will see our application, and it's blazing fast 🚀. 

But if you click around you will notice that some things aren't working. All our server-side logic is ripped out, so our client-side rendered page errors, because it cannot find the API. The entire Server Side Rendered page isn't there (because we had to remove it), and our Incremental Static Regeneration-page isn't regenerating 😫 .

This is an inevitable consequence of deploying our application as a completely static artifact. We can still create an interactive experience for our end-users by using APIs not part of Next.js or make an offline app.

✅ No server-side logic makes it simple to deploy the frontend

✅ Highly performant when deployed through a CDN

✅ Resulting deployment artifacts aren't Next.js specific

❌ Cannot use the backend features from Next.js

> More reading: https://nextjs.org/docs/advanced-features/static-html-export

## Platform-as-a-Service

There are several PaaS solutions for hosting Next.js, most notably Vercel, which is a cloud platform from the creators of Next.js itself. It's a relatively young company, but in the last few years managed to raise several rounds of funding [1] to build out their platform.

For these PaaS products normally combine a globally distributed CDN for hosting your static files and running your server-side Next.js logic on serverless functions. For example, AWS Amplify will use Amazon CloudFront as it's CDN and Lambda@Edge for compute. The details on how these deployments are made are abstracted away, relieving you from the burden of having to do this manually and catch all edge-cases.

One word of caution: Not all Next.js PaaS providers always support all features the Next.js framework provides. This is especially true if you want to use the latest features. As such it is recommended to check the Next.js documentation of the platform.

### Our First Deployment to Vercel

To create our first deployment to Vercel we need to start by creating an account. Open [vercel.com](https://vercel.com/signup) and follow the signup instructions, their free tier is more than sufficient for this demo.

Now we will use the [Vercel CLI](https://vercel.com/cli) to deploy our source code. First run:

```bash
vercel login
```

And then kick-off a deployment for our app:

```bash
vercel --prod
```

You will see that Vercel will send your source-code to their platform and kick-off a build there. Then once that's done provision your environment and in slighly over a minute we have our deployment all up and running. Very neat.

[![asciicast](https://asciinema.org/a/46Wu9EanOYpbYuhHw6NfUYGVW.svg)](https://asciinema.org/a/46Wu9EanOYpbYuhHw6NfUYGVW)

### The Result

Let's open up the webpage where Vercel deployed to. In case you aren't following along, you can open [to-the-cloud.vercel.app](https://to-the-cloud.vercel.app).

If you open up the network tab of your browser's developer tools you might see some interesting things. Especially keep an eye on the request duration.

 1. The first request to a page or API endpoint can be significantly slower, due to the serverless function experiencing a cold-start.
 2. All resources requiring server-side computation take at least 150ms. Which isn't too surprising, given that the serverless function's are provisioned to an AWS region in the East of the US. Much of this latency is merely the time it takes from my request to go from Europe to the US and back. Deploying to multiple regions is only available on the Enterprice tier.
 3. Static resources, such as the home page, the body of the Client Side Rendered page and the Incremental Static Generation page load very fast (usually under 50ms). 🏎 

Now that we have done a full deployment, we can see where platforms like Vercel shine and where it lacks:

✅ Frictionless setup

✅ Performant and batteries-included deployment

✅ Very quick builds and deploys

❌ Lack of control of our deployment

---

## References

[1] [Vercel Closes Second Funding Round In 8 Months](https://news.crunchbase.com/news/vercel-closes-second-funding-round-in-8-months/) - Crunchbase
