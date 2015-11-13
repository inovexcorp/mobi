package org.matonto.repository.config;

public interface RepositoryIDConfig extends RepositoryConfig {

    public String getID();

    public void setID(String id);

    public String getTitle();

    public void setTitle(String title);

    public RepositoryServiceConfig getImplConfig();

    public void setImplConfig(RepositoryServiceConfig config);
}
