package org.matonto.rdf.core.impl.sesame;


public class TreeNamedGraphFactory extends TreeNamedGraphFactoryService {

    private TreeNamedGraphFactory() {}

    /**
     * SingletonHolder is loaded on the first execution of TreeNamedGraphFactory.getInstance()
     * or the first access to SingletonHolder.INSTANCE, not before.
     */
    private static class SingletonHolder {
        private static final TreeNamedGraphFactory INSTANCE = new TreeNamedGraphFactory();
    }

    /**
     * Provide a single shared instance of a SimpleValueFactory.
     *
     * @return a singleton instance of SimpleValueFactory.
     */
    public static TreeNamedGraphFactory getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
