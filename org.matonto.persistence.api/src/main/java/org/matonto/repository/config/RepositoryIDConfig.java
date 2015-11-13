package org.matonto.repository.config;

public interface RepositoryIDConfig extends RepositoryConfig {

    public String getID();

    public void setID(String id);

    public String getTitle();

    public void setTitle(String title);

    public RepositoryImplConfig getImplConfig();

    public void setImplConfig(RepositoryImplConfig config);
}
