package org.matonto.rdf.core.impl.sesame;


public class LinkedHashNamedGraphFactory extends LinkedHashNamedGraphFactoryService {

    private LinkedHashNamedGraphFactory() {}

    /**
     * SingletonHolder is loaded on the first execution of LinkedHashNamedGraphFactory.getInstance()
     * or the first access to SingletonHolder.INSTANCE, not before.
     */
    private static class SingletonHolder {
        private static final LinkedHashNamedGraphFactory INSTANCE = new LinkedHashNamedGraphFactory();
    }

    /**
     * Provide a single shared instance of a SimpleValueFactory.
     *
     * @return a singleton instance of SimpleValueFactory.
     */
    public static LinkedHashNamedGraphFactory getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
