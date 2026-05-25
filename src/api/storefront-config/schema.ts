export interface StorefrontBanner {
  text: string
  fontSize: number | null
  height: number | null
  color: string | null
  background: string | null
  authorizedOnly: boolean
}

export interface StorefrontGeneral {
  phone: string | null
  fax: string | null
  tollFree: string | null
  email: string | null
  address: {
    title: string | null
    link: string | null
  }
  socials: {
    youtube: string | null
    facebook: string | null
    instagram: string | null
    linkedin: string | null
    x: string | null
  }
}

export interface StorefrontHomePage {
  title: string | null
  description: string | null
  image: {
    src: string | null
    link: string | null
  }
  seo: {
    title: string | null
    description: string | null
    image: {
      src: string | null
    }
  }
}

export interface StorefrontConfig {
  general: StorefrontGeneral
  pages: {
    home: StorefrontHomePage
  }
  components: {
    banner: StorefrontBanner
  }
}

export const defaultStorefrontConfig = (): StorefrontConfig => ({
  general: {
    phone: null,
    fax: null,
    tollFree: null,
    email: null,
    address: { title: null, link: null },
    socials: {
      youtube: null,
      facebook: null,
      instagram: null,
      linkedin: null,
      x: null
    }
  },
  pages: {
    home: {
      title: null,
      description: null,
      image: { src: null, link: null },
      seo: {
        title: null,
        description: null,
        image: { src: null }
      }
    }
  },
  components: {
    banner: {
      text: '',
      fontSize: null,
      height: null,
      color: null,
      background: null,
      authorizedOnly: false
    }
  }
})