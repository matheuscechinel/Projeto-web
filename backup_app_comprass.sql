// esse aquivo nao e o original ja que toda vez que tranformoe ele em um codigo binario ele fica dificil de ler, entao ele ta assim



CREATE DATABASE app_de_compras WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Portuguese_Brazil.1252';

CREATE TABLE public.estabelecimentos (
    id integer NOT NULL,
    nome character varying(100) NOT NULL
);

CREATE SEQUENCE public.estabelecimentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.estabelecimentos_id_seq OWNED BY public.estabelecimentos.id;

CREATE TABLE public.fornecedores (
    id integer NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    senha character varying(255) NOT NULL
);

CREATE SEQUENCE public.fornecedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.fornecedores_id_seq OWNED BY public.fornecedores.id;

CREATE TABLE public.ofertas (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    fornecedor_id integer NOT NULL,
    valor numeric NOT NULL,
    data_criacao timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.lances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.lances_id_seq OWNED BY public.ofertas.id;

CREATE TABLE public.listas (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    produto_id integer NOT NULL,
    quantidade numeric NOT NULL
);

CREATE SEQUENCE public.listas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.listas_id_seq OWNED BY public.listas.id;

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    estabelecimento_id integer NOT NULL,
    data_criacao timestamp without time zone DEFAULT now() NOT NULL,
    fornecedor_id integer
);

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;

CREATE TABLE public.produtos (
    id integer NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    nome character varying(100) NOT NULL
);

CREATE SEQUENCE public.produtos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.produtos_id_seq OWNED BY public.produtos.id;

ALTER TABLE ONLY public.estabelecimentos ALTER COLUMN id SET DEFAULT nextval('public.estabelecimentos_id_seq'::regclass);
ALTER TABLE ONLY public.fornecedores ALTER COLUMN id SET DEFAULT nextval('public.fornecedores_id_seq'::regclass);
ALTER TABLE ONLY public.listas ALTER COLUMN id SET DEFAULT nextval('public.listas_id_seq'::regclass);
ALTER TABLE ONLY public.ofertas ALTER COLUMN id SET DEFAULT nextval('public.lances_id_seq'::regclass);
ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);
ALTER TABLE ONLY public.produtos ALTER COLUMN id SET DEFAULT nextval('public.produtos_id_seq'::regclass);

ALTER TABLE ONLY public.estabelecimentos ADD CONSTRAINT estabelecimentos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.fornecedores ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ofertas ADD CONSTRAINT lances_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.listas ADD CONSTRAINT listas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pedidos ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.produtos ADD CONSTRAINT produtos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ofertas ADD CONSTRAINT fk_lance_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);
ALTER TABLE ONLY public.ofertas ADD CONSTRAINT fk_lance_pedido FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id);
ALTER TABLE ONLY public.listas ADD CONSTRAINT fk_lista_pedido FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.listas ADD CONSTRAINT fk_lista_produto FOREIGN KEY (produto_id) REFERENCES public.produtos(id);
ALTER TABLE ONLY public.pedidos ADD CONSTRAINT fk_pedido_estabelecimento FOREIGN KEY (estabelecimento_id) REFERENCES public.estabelecimentos(id);
ALTER TABLE ONLY public.pedidos ADD CONSTRAINT fk_pedido_vencedor FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);