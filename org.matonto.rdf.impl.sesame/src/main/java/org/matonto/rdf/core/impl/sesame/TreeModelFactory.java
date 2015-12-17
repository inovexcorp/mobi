package org.matonto.rdf.core.impl.sesame;


public class TreeModelFactory extends TreeModelFactoryService {

    private TreeModelFactory() {}

    /**
     * SingletonHolder is loaded on the first execution of TreeModelFactory.getInstance()
     * or the first access to SingletonHolder.INSTANCE, not before.
     */
    private static class SingletonHolder {
        private static final TreeModelFactory INSTANCE = new TreeModelFactory();
    }

    /**
     * Provide a single shared instance of a SimpleValueFactory.
     *
     * @return a singleton instance of SimpleValueFactory.
     */
    public static TreeModelFactory getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
