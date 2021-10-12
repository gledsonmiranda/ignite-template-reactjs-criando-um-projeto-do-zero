import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <span>Carregando...</span>
  }

  const minToRead = post.data.content.reduce((acc, content) => {
    acc += Number(content.heading.trim().split(/\s+/).length) / 200;
    acc += Number(RichText.asText(content.body).trim().split(/\s+/).length) / 200;

    return Math.ceil(acc);
  }, 0);

  return (
    <>
      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>

      <article className={commonStyles.container}>
        <header className={styles.header}>
          <h1>{post.data.title}</h1>
          <div className={styles.infos}>
            <time><FiCalendar size={15} /> {format(new Date(post.first_publication_date), 'dd MMM u', {
              locale: ptBR,
            })}</time>
            <span className={styles.author}><FiUser size={15} /> {post.data.author}</span>
            <span className={styles.timer}><FiClock size={15} /> {minToRead} min</span>
          </div>
        </header>

        <section className={styles.post}>
          {post.data.content.map((text, index) => (
            <>
              <h3 key={String(index)}>{text.heading}</h3>
              <div dangerouslySetInnerHTML={{__html: RichText.asHtml(text.body)}} />
            </>
          ))}
        </section>

      </article>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {fetch: ['posts.banner', 'posts.title', 'posts.author', 'posts.content']}
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const slug = context.params.slug;

  const prismic = getPrismicClient();
  const response: Post = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content,
      subtitle: response.data.subtitle
    },
    uid: response.uid,
  }

  return {
    props: {
      post
    },
    revalidate: 60 * 60 * 3 //3 horas
  }
};
