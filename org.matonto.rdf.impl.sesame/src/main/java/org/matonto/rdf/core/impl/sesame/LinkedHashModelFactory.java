package org.matonto.rdf.core.impl.sesame;

public class LinkedHashModelFactory extends LinkedHashModelFactoryService {

    private LinkedHashModelFactory() {}

    /**
     * SingletonHolder is loaded on the first execution of LinkedHashModelFactory.getInstance()
     * or the first access to SingletonHolder.INSTANCE, not before.
     */
    private static class SingletonHolder {
        private static final LinkedHashModelFactory INSTANCE = new LinkedHashModelFactory();
    }

    /**
     * Provide a single shared instance of a SimpleValueFactory.
     *
     * @return a singleton instance of SimpleValueFactory.
     */
    public static LinkedHashModelFactory getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
