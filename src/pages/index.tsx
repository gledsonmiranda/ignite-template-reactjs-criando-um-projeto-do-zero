import { useState } from 'react';

import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import Header from '../components/Header';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps) {
  const { next_page, results } = props.postsPagination;
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  console.log(posts);

  function handleLoadMorePosts() {
    if (nextPage) {
      try {
        fetch(nextPage)
          .then(response => response.json())
          .then(data => {
            const { next_page, results } = data;

            const newPosts = results.map((post:Post) => {
              return {
                uid: post.uid,
                first_publication_date: post.first_publication_date,
                data: {
                  title: post.data.title,
                  subtitle: post.data.subtitle,
                  author: post.data.author,
                }
              }
            })

            if (newPosts.length > 0) {
              setPosts([...posts, ...newPosts]);
            }

            if (next_page) {
              setNextPage(next_page);
            } else {
              setNextPage(null);
            }
          });
      } catch(error) {
        throw new Error('Error on load posts data');
      }
    }
  }

  return (
    <>
      <Head>
        <title>Space Traveling</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
                <div>
                  <time><FiCalendar size={15}/> {format(new Date(post.first_publication_date), 'dd MMM u', {
                  locale: ptBR,
                })}</time>
                  <span className={styles.author}><FiUser size={15} />{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {nextPage && (
          <button className={styles.loadMore} onClick={handleLoadMorePosts}>Carregar mais posts</button>
        )}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
      Prismic.Predicates.at('document.type', 'posts')
    ], {
      fetch: ['posts.title', 'posts.subtitle','posts.author'],
      pageSize: 2
    }
  );

  const { next_page, results } = postsResponse;

  const posts = results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts
      }
    }
  }
};
