### [To The Cloud and Beyond](https://www.eficode.com/events/to-the-cloud-and-beyond)

[GitHub / Addono / deploying-nextjs-demo](https://github.com/Addono/deploying-nextjs-demo)

# How to deploy Next.js - Learn to do it with various vendors


Next.js has quickly become one of the most popular web application frameworks. But the official Next.js documentation does not cover in-depth how to deploy it. In this hands-on demo you will learn how to deploy a Next.js application to various providers, and also their pros and cons.

## Overview

This repository contains the talking notes and demo material for some hands-on examples on how to deploy Next.js. You will find three kinds of files:

1.  Application source code, most notably the Next.js application code in `./src/`.
2.  A `Dockerfile` to build a container image for our application. The image is published to `ghcr.io/addono/deploying-nextjs-demo:main`.
3.  Kubernetes deployment files in `k8s`. We will be using [Kustomize](https://kustomize.io/) to generate our deployment files.

With all these resources in place, we're ready to start deploying our application to various vendors. The table below outlines various different deployment models we can use:

|                                                                                                                            | **CDN**                          | **Compute**                     | **Custom Server** | **Scale down to zero** |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------- | ----------------- | ---------------------- |
| **Completely Static**<br/>AWS CloudFront / AWS S3<br/>Google Cloud Storage<br/>GitHub Pages                                | ✅ By default for most providers | ❌ Client side or external APIs | ❌                | ✅                     |
| **Platform-as-a-Service**<br/>Vercel<br/>Netlify<br/>AWS Amplify<br/>Serverless Next.js                                    | ✅ Global edge CDN               | ✅ Serverless Functions         | ❌                | ✅                     |
| **Container-as-a-Service or Kubernetes**<br/>Azure Web App Service<br/>AWS Fargate<br/>Google Kubernetes Engine<br/>Heroku | 🚧 Roll it yourself              | ✅ Node.js server               | ✅                | ❌                     |

## Completely Static

Next.js supports creating static builds out of the box. In this mode, you cannot use any dynamically rendered or API endpoint features from the Next.js framework as it will not provision any server-side logic. The output is a static HTML export, which you can deploy through a CDN.

### Our First Build

```bash
yarn next build && yarn next export
```

<details>
    <summary><b>Did it work?</b></summary>
        <p>
        Sadly no, when running this command we will get the following error:<br/> 
        <pre><code>Error: Error for page /ssr: pages with `getServerSideProps` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export</code></pre>
        </p>
        <p>
            One of our pages uses Server Side Rendering. Something which isn't supported in static exports. Let's rename <code>./src/ssr.tsx</code> to <code>./src/ssr.tsx.bak</code> and try again.
        </p>
    </details>

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

1.  The first request to a page or API endpoint can be significantly slower, due to the serverless function experiencing a cold-start.
2.  All resources requiring server-side computation take at least 150ms. Which isn't too surprising, given that the serverless function's are provisioned to an AWS region in the East of the US. Much of this latency is merely the time it takes from my request to go from Europe to the US and back. Deploying to multiple regions is only available on the Enterprice tier.
3.  Static resources, such as the home page, the body of the Client Side Rendered page and the Incremental Static Generation page load very fast (usually under 50ms). 🏎

Now that we have done a full deployment, we can see where platforms like Vercel shine and where it lacks:

✅ Frictionless setup

✅ Performant and batteries-included deployment

✅ Very quick builds and deploys

❌ Lack of control of our deployment

## Container-as-a-Service / Kubernetes

Lastsly we will dive into deploying our Next.js application as a container. Containerizing a Next.js application isn't particularly difficult. However, as we will see there are some funny things happening when we horizontally scale our application.

### Pre-requisites

We will be using a local Kubernetes cluster for this guide, provisioned by [Minikube](https://minikube.sigs.k8s.io), head over to their [documentation](https://minikube.sigs.k8s.io/docs/start/) for details on how to set it up. In addition, we will be using [Kubectl](https://kubernetes.io/docs/tasks/tools/) and [Kustomize](https://kubectl.docs.kubernetes.io/installation/kustomize/).

Once you have installed all required tools and have a running Kubernetes cluster, we need to install Nginx Ingress.

```bash
# Enable Nginx Ingress
minikube addons enable ingress

# Expose the ingress locally
minikube tunnel
```

Instructions for other Kubernetes providers can be found in the [Nginx Ingress](https://kubernetes.github.io/ingress-nginx/deploy/#provider-specific-steps) documentation.

### Building the Image

In [`./Dockerfile`](./Dockerfile) you find the build configuration to turn our Next.js application into a container image. It's strongly based on the Dockerfile from the [official documentation], featuring some minor adjustments here and there to make it work for this project as well.

There's nothing too special going on here, we use multiple stages which yield some optimizations in image size. In the end we have a container image with Node and the build artifacts of our Next.js application ready to be deployed. On boot, the container will start the production Next.js server the application came with. One of the main advantages of running Next.js inside a container is that it does support custom webservers, which can be usefull in some situations if you have particular needs.

Feel free to build the image yourself, or alternatively you can use a pre-build image [`ghcr.io/addono/deploying-nextjs-demo:main`](https://github.com/Addono/deploying-nextjs-demo/pkgs/container/deploying-nextjs-demo) to hit the ground running.

### Single Replica Deployment

Let's start with creating our first deployment. This initial deployment will start a single container running inside our Kubernetes cluster. In addition, we will create an Ingress resource such that we can access the webserver running inside the container.

```bash
kustomize build k8s/resources/1-single | kubectl apply -f -
```

If we now list our ingresses and deployments we will see that we have the following resources:

```
❯ kubectl get deploy,ingress
NAME                                        READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/single-nextjs-website       1/1     1            1           36s

NAME                                                         CLASS    HOSTS                         ADDRESS        PORTS   AGE
ingress.networking.k8s.io/single-nextjs-website-ingress      <none>   single.127.0.0.1.nip.i      192.168.57.2   80      36s
```

Great, [single.127.0.0.1.nip.io](http://single.127.0.0.1.nip.io) is the domain name we can use to access our environment. Click through it to see our app in action.

### Replicated Deployment

Just having a single node serve all our traffic is maybe fine for smaller deployments, but if our app needs to be deployed at scale, in a high-availability mode or in multiple regions, then we will need to horizontally scale our app.

Apply the following deployment manifests to create another deployment and ingress resource for our app. This time our deployment will be replicated over several containers.

```bash
kustomize build k8s/resources/2-replicated | kubectl apply -f -
```

Again, let's start by listing our resources. We will see that we now have a new ingress at [replicated.127.0.0.1.nip.io](http://replicated.127.0.0.1.nip.io) which we can use to access our replicated deployment. The replicated deployment contains five instances of our app. When we now access our app, our traffic will get routed at random to one of the five instances.

```
❯ kubectl get deploy,ingress
NAME                                        READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/replicated-nextjs-website   5/5     5            5           1h
deployment.apps/single-nextjs-website       1/1     1            1           1h

NAME                                                         CLASS    HOSTS                             ADDRESS        PORTS   AGE
ingress.networking.k8s.io/replicated-nextjs-website-ingress  <none>   replicated.127.0.0.1.nip.io       192.168.57.2   80      1h
ingress.networking.k8s.io/single-nextjs-website-ingress      <none>   single.127.0.0.1.nip.io           192.168.57.2   80      1h
```

Click a bit through the pages of the webshop and maybe refresh pages once in a while. If you look carefully you will see that some weird things sometimes start to happen: We will start to get served a mix of newer and older pages.

There are several caching mechanisms inside Next.js, but none of these are shared between the instances. As a result, every page is cached separately between different instances, which means that we will get served a mix of older and newer pages depending on which instance our traffic is routed to. To users navigating your website this means that refreshing pages leads to flickering between old and new content, ouch.

Whether this is a problem for you depends on your specific application, your requirements and the Next.js features you're using. E.g. if you only use server-side rendered pages, then you won't be using the application cache and you will be unaffected.

### Reducing Inconsistencies with Sticky Sessions

There are several ways on how to improve our end-user experience once cache inconsistencies become an issue. Here we will be looking into using sticky sessions, which will try to route the traffic of one user to the same instance.

Let's create another ingress for our application, this time with session affinity enabled:

```
kustomize build resources/3-sticky-sessions | kubectl apply -f -
```

This will create the following resource:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/affinity: cookie
  name: sticky-session-nextjs-website-ingress
spec:
  rules:
    - host: sticky-sessions.replicated.127.0.0.1.nip.io
      http:
        paths:
          - backend:
              service:
                name: replicated-nextjs-website-service
                port:
                  number: 80
            path: /
            pathType: Prefix
```

We re-used the replicated deployment from previous section, but our new ingress uses a different domain for us to use: [sticky-sessions.replicated.127.0.0.1.nip.io](http://sticky-sessions.replicated.127.0.0.1.nip.io).

We'll notice that this solved most of our issues. There are still edge-cases where we'll get the behaviour closer to the replicated example. But for the vast majority of our end-users they will have a similar experience of our deployment with only a single container.

### Other Improvements

Sticky sessions is only the first step in creating a better end-user experience. First and foremost you probably want to look into adding a CDN. You could achieve this by adding a CDN as a caching layer in front of your pods. The files in the `_next/static/` path can easily be cached for a long time, as their filenames are unique. Other pages, like statically generated pages can be cached as well, but require you to handle evicting the cache if a newer version of your app goes live.

Alternatively to putting the CDN in-between your application and the internet is to push all static files to your CDN and ensure that the traffic is routed to your CDN. You can use the [`assetPrefix`](https://nextjs.org/docs/api-reference/next.config.js/cdn-support-with-asset-prefix) configuration option in `next.config.js` to tell Next.js to expect to serve your static assets from a different domain.

If inconsistencies are completely unacceptable, then you might want to avoid some of the features from Nextjs which use caching. Completely client or server-side rendered pages bypass the caching mechanism and ensure a fresh render on each visit. But this will come at the cost of slightly lower performance.

On the application side you can also consider rehydrating after page-load. Such that after the initial page load is done another request is made to the backend to update (parts of) the data. For example, a webshop can use incremental static generation for its shop pages, where the page will be cached including most of the body of the page. But part of the page data, such as price and availability, is then hidden behind a suspense and freshly retrieved by the browser.

---

## References

[1] [Vercel Closes Second Funding Round In 8 Months](https://news.crunchbase.com/news/vercel-closes-second-funding-round-in-8-months/) - Crunchbase
